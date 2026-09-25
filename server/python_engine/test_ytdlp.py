import json
import sys
import yt_dlp

def main():
    url = 'https://youtu.be/e2kIhlfmOJw?si=5js6Ops_8pYHN87_'
    ffmpeg_path = r'C:\Users\raivi\OneDrive\Desktop\Social\server\node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe'
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'ffmpeg_location': ffmpeg_path
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        print('Title:', info.get('title'))
        print('Duration:', info.get('duration'))
        formats = info.get('formats', [])
        print(f'Total formats discovered: {len(formats)}')
        
        video_formats = {}
        for f in formats:
            height = f.get('height')
            if height and f.get('vcodec') != 'none':
                quality = f'{height}p'
                filesize = f.get('filesize') or f.get('filesize_approx')
                size_mb = f'{filesize / 1024 / 1024:.1f} MB' if filesize else 'Unknown'
                video_formats[quality] = {
                    'format_id': f['format_id'],
                    'ext': f.get('ext'),
                    'height': height,
                    'vcodec': str(f.get('vcodec')),
                    'acodec': str(f.get('acodec')),
                    'size': size_mb,
                    'fps': f.get('fps')
                }
        
        for q in sorted(video_formats.keys(), key=lambda x: int(x.replace('p', '')), reverse=True):
            d = video_formats[q]
            print(f'  - {q}: format_id={d["format_id"]}, vcodec={d["vcodec"][:10]}, acodec={d["acodec"][:10]}, size={d["size"]}')

if __name__ == '__main__':
    main()
