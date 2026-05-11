import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { Preset } from '../types';

/**
 * Firebase 配置
 * 注意：实际使用时应从环境变量或配置文件读取
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || ''
};

/**
 * Firebase 应用实例
 */
let app: FirebaseApp | null = null;

/**
 * Firebase Auth 实例
 */
let auth: Auth | null = null;

/**
 * Firestore 实例
 */
let db: Firestore | null = null;

/**
 * 当前登录用户
 */
let currentUser: User | null = null;

/**
 * 初始化 Firebase
 * 应在应用启动时调用一次
 */
export function initializeFirebase(): boolean {
  try {
    if (!firebaseConfig.apiKey) {
      console.warn('Firebase 配置未设置，跳过初始化');
      return false;
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // 监听认证状态变化
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
    });

    return true;
  } catch (error) {
    console.error('Firebase 初始化失败:', error);
    return false;
  }
}

/**
 * 获取当前用户
 */
export function getCurrentUser(): User | null {
  return currentUser;
}

/**
 * 检查用户是否已登录
 */
export function isUserLoggedIn(): boolean {
  return !!currentUser;
}

/**
 * 匿名登录
 * 无需账号即可使用基础功能
 */
export async function signInAnonymous(): Promise<User | null> {
  try {
    if (!auth) {
      throw new Error('Firebase Auth 未初始化');
    }
    const result = await signInAnonymously(auth);
    currentUser = result.user;
    return result.user;
  } catch (error) {
    console.error('匿名登录失败:', error);
    return null;
  }
}

/**
 * 邮箱密码注册
 * @param email - 邮箱地址
 * @param password - 密码
 */
export async function signUpWithEmail(email: string, password: string): Promise<User | null> {
  try {
    if (!auth) {
      throw new Error('Firebase Auth 未初始化');
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = result.user;
    return result.user;
  } catch (error) {
    console.error('注册失败:', error);
    return null;
  }
}

/**
 * 邮箱密码登录
 * @param email - 邮箱地址
 * @param password - 密码
 */
export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  try {
    if (!auth) {
      throw new Error('Firebase Auth 未初始化');
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    currentUser = result.user;
    return result.user;
  } catch (error) {
    console.error('登录失败:', error);
    return null;
  }
}

/**
 * 退出登录
 */
export async function signOutUser(): Promise<boolean> {
  try {
    if (!auth) {
      throw new Error('Firebase Auth 未初始化');
    }
    await signOut(auth);
    currentUser = null;
    return true;
  } catch (error) {
    console.error('退出登录失败:', error);
    return false;
  }
}

// ==================== Firestore 云同步 ====================

/**
 * 同步预设到云端
 * @param presets - 要同步的预设数组
 */
export async function syncPresetsToCloud(presets: Preset[]): Promise<boolean> {
  try {
    if (!db || !currentUser) {
      console.warn('Firestore 未初始化或用户未登录');
      return false;
    }

    const userId = currentUser.uid;
    const presetsRef = collection(db, 'users', userId, 'presets');

    // 批量写入预设
    const promises = presets.map(async (preset) => {
      const presetDoc = doc(presetsRef, preset.id);
      await setDoc(presetDoc, {
        ...preset,
        syncedAt: Timestamp.now()
      });
    });

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('同步预设到云端失败:', error);
    return false;
  }
}

/**
 * 从云端获取预设
 */
export async function fetchPresetsFromCloud(): Promise<Preset[]> {
  try {
    if (!db || !currentUser) {
      console.warn('Firestore 未初始化或用户未登录');
      return [];
    }

    const userId = currentUser.uid;
    const presetsRef = collection(db, 'users', userId, 'presets');
    const snapshot = await getDocs(presetsRef);

    const presets: Preset[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      presets.push({
        id: data.id,
        name: data.name,
        type: data.type,
        colorParams: data.colorParams,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    return presets;
  } catch (error) {
    console.error('从云端获取预设失败:', error);
    return [];
  }
}

/**
 * 删除云端预设
 * @param presetId - 预设 ID
 */
export async function deletePresetFromCloud(presetId: string): Promise<boolean> {
  try {
    if (!db || !currentUser) {
      console.warn('Firestore 未初始化或用户未登录');
      return false;
    }

    const userId = currentUser.uid;
    const presetDoc = doc(db, 'users', userId, 'presets', presetId);
    await deleteDoc(presetDoc);
    return true;
  } catch (error) {
    console.error('删除云端预设失败:', error);
    return false;
  }
}

/**
 * 保存用户设置到云端
 * @param settings - 用户设置对象
 */
export async function saveUserSettings(settings: Record<string, any>): Promise<boolean> {
  try {
    if (!db || !currentUser) {
      console.warn('Firestore 未初始化或用户未登录');
      return false;
    }

    const userId = currentUser.uid;
    const settingsDoc = doc(db, 'users', userId, 'settings', 'preferences');
    await setDoc(settingsDoc, {
      ...settings,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('保存用户设置失败:', error);
    return false;
  }
}

/**
 * 从云端获取用户设置
 */
export async function fetchUserSettings(): Promise<Record<string, any> | null> {
  try {
    if (!db || !currentUser) {
      console.warn('Firestore 未初始化或用户未登录');
      return null;
    }

    const userId = currentUser.uid;
    const settingsDoc = doc(db, 'users', userId, 'settings', 'preferences');
    const snapshot = await getDoc(settingsDoc);

    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error('获取用户设置失败:', error);
    return null;
  }
}
