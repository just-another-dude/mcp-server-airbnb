declare module 'robots-parser' {
  interface RobotsParser {
    // undefined when the URL is not on the robots.txt origin (including bare paths).
    isAllowed(url: string, userAgent?: string): boolean | undefined;
  }

  function robotsParser(url: string, content: string): RobotsParser;
  
  export default robotsParser;
}
