export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
};

export const getFirstImage = (blocks: any[]): string | null => {
  const imgBlock = blocks.find(b => b.type === 'image' || b.type === 'video');
  return imgBlock ? imgBlock.content : null;
};

export const getPreviewText = (blocks: any[]): string => {
  const textBlock = blocks.find(b => b.type === 'text' && b.content.trim().length > 0);
  return textBlock ? textBlock.content.substring(0, 60) + (textBlock.content.length > 60 ? '...' : '') : 'New Frame';
};
