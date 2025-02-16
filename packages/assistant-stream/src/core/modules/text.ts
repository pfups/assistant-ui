import { AssistantStream, AssistantStreamChunk } from "../AssistantStream";
import { UnderlyingReadable } from "../utils/stream/UnderlyingReadable";

export type TextStreamController = {
  append(textDelta: string): void;
  close(): void; // TODO reason? error?
};

class TextStreamControllerImpl implements TextStreamController {
  private _controller: ReadableStreamDefaultController<AssistantStreamChunk>;

  constructor(
    controller: ReadableStreamDefaultController<AssistantStreamChunk>,
  ) {
    this._controller = controller;
  }

  append(textDelta: string) {
    this._controller.enqueue({
      type: "text-delta",
      path: [],
      textDelta,
    });
    return this;
  }

  close() {
    this._controller.close();
  }
}

export const createTextStream = (
  readable: UnderlyingReadable<TextStreamController>,
): AssistantStream => {
  return new ReadableStream({
    start(c) {
      return readable.start?.(new TextStreamControllerImpl(c));
    },
    pull(c) {
      return readable.pull?.(new TextStreamControllerImpl(c));
    },
    cancel(c) {
      return readable.cancel?.(c);
    },
  });
};

export const createTextStreamController = () => {
  let controller!: TextStreamController;
  const stream = createTextStream({
    start(c) {
      controller = c;
    },
  });
  return [stream, controller] as const;
};
