/*
  Library data. Paths point to files in /public:
  videos/   1080p website previews with sound
  posters/  still frame shown while a video loads
  downloads/ original 4K source files, served as-is for download

  To add an animation: add its files to public/, then add an entry below.
*/

export const COLLECTIONS = [
  { id: 'pickaxe', title: 'Pickaxe' },
  { id: 'heart', title: 'Heart' },
  { id: 'clock', title: 'Clock' },
  { id: 'mending', title: 'Mending' },
];

export const ANIMATIONS = [
  { id: 'stone-pickaxe', collectionId: 'pickaxe', title: 'Stone Pickaxe', description: 'A Minecraft Stone Pickaxe animation, ready to drop into your edit as a transition or accent.', video: '/videos/stone-pickaxe.mp4', poster: '/posters/stone-pickaxe.jpg', download: 'Stone_Pickaxe.mp4' },
  { id: 'wooden-pickaxe', collectionId: 'pickaxe', title: 'Wooden Pickaxe', description: 'A Minecraft Wooden Pickaxe animation, ready to drop into your edit as a transition or accent.', video: '/videos/wooden-pickaxe.mp4', poster: '/posters/wooden-pickaxe.jpg', download: 'Wooden_Pickaxe.mp4' },
  { id: 'copper-pickaxe', collectionId: 'pickaxe', title: 'Copper Pickaxe', description: 'A Minecraft Copper Pickaxe animation, ready to drop into your edit as a transition or accent.', video: '/videos/copper-pickaxe.mp4', poster: '/posters/copper-pickaxe.jpg', download: 'Copper_Pickaxe.mp4' },
  { id: 'diamond-pickaxe', collectionId: 'pickaxe', title: 'Diamond Pickaxe', description: 'A Minecraft Diamond Pickaxe animation, ready to drop into your edit as a transition or accent.', video: '/videos/diamond-pickaxe.mp4', poster: '/posters/diamond-pickaxe.jpg', download: 'Diamond_Pickaxe.mp4' },
  { id: 'golden-pickaxe', collectionId: 'pickaxe', title: 'Golden Pickaxe', description: 'A Minecraft Golden Pickaxe animation, ready to drop into your edit as a transition or accent.', video: '/videos/golden-pickaxe.mp4', poster: '/posters/golden-pickaxe.jpg', download: 'Golden_Pickaxe.mp4' },
  { id: 'nethrite-pickaxe', collectionId: 'pickaxe', title: 'Nethrite Pickaxe', description: 'A Minecraft Nethrite Pickaxe animation, ready to drop into your edit as a transition or accent.', video: '/videos/nethrite-pickaxe.mp4', poster: '/posters/nethrite-pickaxe.jpg', download: 'Nethrite_Pickaxe.mp4' },
  { id: 'iron-pickaxe', collectionId: 'pickaxe', title: 'Iron Pickaxe', description: 'A Minecraft Iron Pickaxe animation, ready to drop into your edit as a transition or accent.', video: '/videos/iron-pickaxe.mp4', poster: '/posters/iron-pickaxe.jpg', download: 'Iron_Pickaxe.mp4' },
  { id: 'heart-animation', collectionId: 'heart', title: 'Heart Animation', description: 'A Minecraft-style heart animation, ready to drop into your edit as a transition or accent.', video: '/videos/heart-animation.mp4', poster: '/posters/heart-animation.jpg', download: 'Heart_Animation.mp4' },
  { id: 'hardcore-heart-animation', collectionId: 'heart', title: 'Hardcore Heart Animation', description: 'A hardcore Minecraft-style heart animation, ready to drop into your edit as a transition or accent.', video: '/videos/hardcore-heart-animation.mp4', poster: '/posters/hardcore-heart-animation.jpg', download: 'Hardcore_Heart_Animation.mp4' },
  { id: 'clock-animation', collectionId: 'clock', title: 'Clock Animation', description: 'A Minecraft-style clock animation, ready to drop into your edit as a transition or accent.', video: '/videos/clock-animation.mp4', poster: '/posters/clock-animation.jpg', download: 'Clock_Animation.mp4' },
  { id: 'mending-enchantment', collectionId: 'mending', title: 'Mending Enchantment', description: 'A Minecraft Mending enchantment animation, ready to drop into your edit as a transition or accent.', video: '/videos/mending-enchantment.mp4', poster: '/posters/mending-enchantment.jpg', download: 'Mending_Enchantment.mp4' },
];

export const getAnimation = (id) => ANIMATIONS.find((a) => a.id === id) || null;
export const getCollection = (id) => COLLECTIONS.find((c) => c.id === id) || null;
export const getCollectionItems = (collectionId) => ANIMATIONS.filter((a) => a.collectionId === collectionId);
