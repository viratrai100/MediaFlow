import playdl from 'play-dl';

async function testPlayDl() {
  const url = 'https://youtu.be/e2kIhlfmOJw?si=5js6Ops_8pYHN87_';
  console.log('Testing play-dl with URL:', url);
  
  const videoInfo = await playdl.video_info(url);
  console.log('Title:', videoInfo.video_details.title);
  console.log('Duration:', videoInfo.video_details.durationInSec);
  console.log('Channel:', videoInfo.video_details.channel?.name);
  console.log('Formats count:', videoInfo.format.length);
  
  console.log('\nSample formats:');
  for (let i = 0; i < Math.min(8, videoInfo.format.length); i++) {
    const f = videoInfo.format[i];
    console.log(`[${i}] itag: ${f.itag}, quality: ${f.qualityLabel || f.quality}, mime: ${f.mimeType}, container: ${f.container}, hasAudio: ${!!f.audioBitrate}, hasVideo: ${!!f.qualityLabel}, url: ${f.url ? 'YES' : 'NO'}`);
  }
  
  // Test stream retrieval
  const stream = await playdl.stream(url, { quality: 2 });
  console.log('\nStream type:', stream.type);
  console.log('Stream stream exists:', !!stream.stream);
}

testPlayDl().catch(console.error);
