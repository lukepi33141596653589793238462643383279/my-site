// ===============================
// 📰 FEED SYSTEM - FIREBASE MODULE
// db/feed.db.js
// ===============================

// This module handles:
// - Global feed
// - Following feed
// - Trending posts
// - Feed ranking
// - Real-time updates
// - Feed filters
// - Infinite scroll support
// - Personalized algorithm
// - Feed caching

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// 🔥 INIT
// ===============================
const db = getFirestore();

// ===============================
// 🧠 CACHE SYSTEM
// ===============================
const feedCache = {
  globalFeed: new Map(),
  followingFeed: new Map(),
  trendingFeed: new Map(),
  personalizedFeed: new Map()
};

// ===============================
// 🧩 UTILITIES
// ===============================
function isValidId(id) {
  return typeof id === "string" && id.length > 0;
}

function now() {
  return serverTimestamp();
}

// ===============================
// 📊 FEED SCORE ALGORITHM
// ===============================
// Higher score = higher ranking
// Formula:
// likes * 3
// comments * 5
// shares * 7
// recency bonus
// engagement bonus
// ===============================
export function calculateFeedScore(post = {}) {

  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const shares = post.sharesCount || 0;

  const createdAt = post.createdAt?.seconds || 0;

  const currentTime = Math.floor(Date.now() / 1000);

  const ageHours = (currentTime - createdAt) / 3600;

  // engagement
  const engagement =
    (likes * 3) +
    (comments * 5) +
    (shares * 7);

  // recency decay
  const decay = Math.max(1, ageHours / 6);

  // final score
  const score = engagement / decay;

  return Math.floor(score);
}

// ===============================
// 🌎 GET GLOBAL FEED
// ===============================
export async function getGlobalFeed({
  limitCount = 20,
  lastPost = null
} = {}) {

  try {

    const postsCol = collection(db, "posts");

    let q;

    if (lastPost) {

      q = query(
        postsCol,
        orderBy("createdAt", "desc"),
        startAfter(lastPost),
        limit(limitCount)
      );

    } else {

      q = query(
        postsCol,
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

    }

    const snap = await getDocs(q);

    const posts = [];

    snap.forEach(doc => {

      posts.push({
        id: doc.id,
        ...doc.data()
      });

    });

    feedCache.globalFeed.set("latest", posts);

    return posts;

  } catch (err) {
    console.error("getGlobalFeed error:", err);
    return [];
  }
}

// ===============================
// 👥 GET FOLLOWING FEED
// ===============================
export async function getFollowingFeed(
  userId,
  {
    limitCount = 20
  } = {}
) {

  if (!isValidId(userId)) {
    return [];
  }

  try {

    // following list
    const followingCol = collection(
      db,
      "following",
      userId,
      "list"
    );

    const followingSnap = await getDocs(followingCol);

    const followingIds = [];

    followingSnap.forEach(doc => {
      followingIds.push(doc.id);
    });

    if (!followingIds.length) {
      return [];
    }

    const postsCol = collection(db, "posts");

    const q = query(
      postsCol,
      where("userId", "in", followingIds.slice(0, 10)),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const postsSnap = await getDocs(q);

    const posts = [];

    postsSnap.forEach(doc => {

      posts.push({
        id: doc.id,
        ...doc.data()
      });

    });

    feedCache.followingFeed.set(userId, posts);

    return posts;

  } catch (err) {
    console.error("getFollowingFeed error:", err);
    return [];
  }
}

// ===============================
// 🔥 GET TRENDING FEED
// ===============================
export async function getTrendingFeed({
  limitCount = 20
} = {}) {

  try {

    const postsCol = collection(db, "posts");

    const q = query(
      postsCol,
      orderBy("likesCount", "desc"),
      limit(100)
    );

    const snap = await getDocs(q);

    const posts = [];

    snap.forEach(doc => {

      const data = {
        id: doc.id,
        ...doc.data()
      };

      data.feedScore = calculateFeedScore(data);

      posts.push(data);

    });

    // sort by algorithm
    posts.sort((a, b) => {
      return b.feedScore - a.feedScore;
    });

    const finalPosts = posts.slice(0, limitCount);

    feedCache.trendingFeed.set("trending", finalPosts);

    return finalPosts;

  } catch (err) {
    console.error("getTrendingFeed error:", err);
    return [];
  }
}

// ===============================
// 🧠 GET PERSONALIZED FEED
// ===============================
export async function getPersonalizedFeed(
  userId,
  {
    limitCount = 20
  } = {}
) {

  if (!isValidId(userId)) {
    return [];
  }

  try {

    const followingFeed =
      await getFollowingFeed(userId);

    const trendingFeed =
      await getTrendingFeed({
        limitCount
      });

    // combine feeds
    const merged = [
      ...followingFeed,
      ...trendingFeed
    ];

    // remove duplicates
    const uniquePosts = [];

    const seen = new Set();

    for (const post of merged) {

      if (!seen.has(post.id)) {

        seen.add(post.id);
        uniquePosts.push(post);

      }
    }

    // sort by score
    uniquePosts.sort((a, b) => {

      const scoreA = calculateFeedScore(a);
      const scoreB = calculateFeedScore(b);

      return scoreB - scoreA;

    });

    const finalFeed =
      uniquePosts.slice(0, limitCount);

    feedCache.personalizedFeed.set(
      userId,
      finalFeed
    );

    return finalFeed;

  } catch (err) {
    console.error("getPersonalizedFeed error:", err);
    return [];
  }
}

// ===============================
// 🚫 FILTER BLOCKED USERS
// ===============================
export async function filterBlockedPosts(
  userId,
  posts = []
) {

  try {

    const blockedCol = collection(
      db,
      "blocked",
      userId,
      "list"
    );

    const snap = await getDocs(blockedCol);

    const blockedIds = [];

    snap.forEach(doc => {
      blockedIds.push(doc.id);
    });

    return posts.filter(post => {
      return !blockedIds.includes(post.userId);
    });

  } catch (err) {
    console.error("filterBlockedPosts error:", err);
    return posts;
  }
}

// ===============================
// 🔇 FILTER MUTED USERS
// ===============================
export async function filterMutedPosts(
  userId,
  posts = []
) {

  try {

    const mutedCol = collection(
      db,
      "muted",
      userId,
      "list"
    );

    const snap = await getDocs(mutedCol);

    const mutedIds = [];

    snap.forEach(doc => {
      mutedIds.push(doc.id);
    });

    return posts.filter(post => {
      return !mutedIds.includes(post.userId);
    });

  } catch (err) {
    console.error("filterMutedPosts error:", err);
    return posts;
  }
}

// ===============================
// 📌 PIN POST
// ===============================
export async function pinPost(
  postId
) {

  try {

    const postRef = doc(
      db,
      "posts",
      postId
    );

    await updateDoc(postRef, {
      pinned: true,
      pinnedAt: now()
    });

    return {
      success: true
    };

  } catch (err) {
    console.error("pinPost error:", err);
    throw err;
  }
}

// ===============================
// 📌 UNPIN POST
// ===============================
export async function unpinPost(
  postId
) {

  try {

    const postRef = doc(
      db,
      "posts",
      postId
    );

    await updateDoc(postRef, {
      pinned: false
    });

    return {
      success: true
    };

  } catch (err) {
    console.error("unpinPost error:", err);
    throw err;
  }
}

// ===============================
// 🔄 REALTIME GLOBAL FEED
// ===============================
export function listenGlobalFeed(
  callback,
  limitCount = 20
) {

  const postsCol = collection(db, "posts");

  const q = query(
    postsCol,
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(q, (snap) => {

    const posts = [];

    snap.forEach(doc => {

      posts.push({
        id: doc.id,
        ...doc.data()
      });

    });

    feedCache.globalFeed.set(
      "latest",
      posts
    );

    callback(posts);

  });
}

// ===============================
// 🔄 REALTIME TRENDING FEED
// ===============================
export function listenTrendingFeed(
  callback,
  limitCount = 20
) {

  const postsCol = collection(db, "posts");

  const q = query(
    postsCol,
    orderBy("likesCount", "desc"),
    limit(100)
  );

  return onSnapshot(q, (snap) => {

    const posts = [];

    snap.forEach(doc => {

      const data = {
        id: doc.id,
        ...doc.data()
      };

      data.feedScore =
        calculateFeedScore(data);

      posts.push(data);

    });

    posts.sort((a, b) => {
      return b.feedScore - a.feedScore;
    });

    const finalFeed =
      posts.slice(0, limitCount);

    feedCache.trendingFeed.set(
      "trending",
      finalFeed
    );

    callback(finalFeed);

  });
}

// ===============================
// 📊 DEBUG CACHE
// ===============================
export function debugFeedCache() {

  return {
    globalFeed: Array.from(
      feedCache.globalFeed.entries()
    ),
    followingFeed: Array.from(
      feedCache.followingFeed.entries()
    ),
    trendingFeed: Array.from(
      feedCache.trendingFeed.entries()
    ),
    personalizedFeed: Array.from(
      feedCache.personalizedFeed.entries()
    )
  };

}

// ===============================
// 🧹 CLEAR CACHE
// ===============================
export function clearFeedCache() {

  feedCache.globalFeed.clear();
  feedCache.followingFeed.clear();
  feedCache.trendingFeed.clear();
  feedCache.personalizedFeed.clear();

}

// ===============================
// 🧠 SYSTEM READY CHECK
// ===============================
export function feedSystemReady() {
  return typeof db !== "undefined";
}

// ===============================
// END MODULE
// ===============================
