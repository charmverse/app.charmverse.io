export const safeRequestAnimationFrame =
  typeof window !== 'undefined' && window.requestAnimationFrame
    ? window.requestAnimationFrame
    : function (callback: ((time: number) => void)) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - ((window as any).lastTime ?? 0)));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
        (window as any).lastTime = currTime + timeToCall;
        return id;
      };