import { auth } from '../firebase';

export async function getSocialAuthUrl(platform: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/social/connect/${platform}`, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to get auth URL');
  }
  
  return await res.json();
}

export async function deployPostToSocial(postId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/social/post/${postId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to deploy post');
  }
  
  return await res.json();
}
