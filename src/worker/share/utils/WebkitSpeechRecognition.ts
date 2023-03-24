export default class WebkitSpeechRecognition {
  private recognition?: any;

  constructor() {}
  init(){
    this.recognition = new (window as any).webkitSpeechRecognition();
    this.recognition.lang = 'zh-CN';
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
  }

  start(): Promise<string> {
    this.init();
    return new Promise((resolve, reject) => {
      this.recognition.onerror = (event: Event) => {
        this.recognition.abort();
        reject(event);
      };

      // @ts-ignore
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1][0].transcript;
        resolve(result);
      };

      this.recognition.start();
    });
  }

  stop(): void {
    this.recognition.stop();
    this.recognition = null
  }
}
