declare module 'shaka-player' {
  const shaka: {
    Player: new () => {
      attach(videoElement: HTMLVideoElement): Promise<void>;
      configure(config: Record<string, unknown>): void;
      addEventListener(event: string, callback: (event: unknown) => void): void;
      load(uri: string): Promise<void>;
      destroy(): Promise<void>;
    };
    polyfill: {
      installAll(): void;
    };
  } & {
    Player: {
      isBrowserSupported(): boolean;
    };
  };
  export default shaka;
}
