export interface M3UItem {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

export function parseM3U(content: string): M3UItem[] {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const items: M3UItem[] = [];
  
  let currentItem: Partial<M3UItem> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      
      currentItem = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : undefined,
        group: groupMatch ? groupMatch[1] : undefined,
      };
    } else if (currentItem && !line.startsWith('#')) {
      currentItem.url = line;
      items.push(currentItem as M3UItem);
      currentItem = null;
    }
  }
  
  return items;
}
