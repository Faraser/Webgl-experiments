class RenderLoop {
    constructor(callback, fps) {
        const self = this;
        this.msLastFrame = null; // The time in Milliseconds of the last frame
        this.callback = callback; // What function to call for each frame
        this.isActive = false; // Control the On/Off state of the render loop
        this.fps = 0; // Save the value of how fast the loop is going

        if (!fps && fps > 0) { // Build run method that limits the framerate
            this.msFpsLimit = 1000 / fps; // Calc how many milliseconds per frame in one second of time

            this.run = function() {
                // Calc deltatime between frames and the FPS currently
                const msCurrent = performance.now();
                const msDelta = msCurrent - self.msLastFrame;
                const deltaTime = msDelta / 1000.0;

                if (msDelta >= self.msFpsLimit) {
                    self.fps = Math.floor(1 / deltaTime);
                    self.msLastFrame = msCurrent;
                    self.callback(deltaTime);
                }

                if (self.isActive) {
                    window.requestAnimationFrame(self.run);
                }
            }
        } else {
            this.run = function() {
                const msCurrent = performance.now();
                const deltaTime = (msCurrent - self.msLastFrame) / 1000.0;

                self.fps = Math.floor(1 / deltaTime);
                self.msLastFrame = msCurrent;

                self.callback(deltaTime);
                if (self.isActive) {
                    window.requestAnimationFrame(self.run);
                }
            }
        }
    }

    start() {
        this.isActive = true;
        this.msLastFrame = performance.now();
        window.requestAnimationFrame(this.run);
        return this;
    }

    stop() {
        this.isActive = false;
    }
}
