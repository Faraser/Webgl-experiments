class Resources {
    static setup(gl, completeHandler) {
        Resources.gl = gl;
        Resources.onComplete = completeHandler;
        return this;
    }

    static start() {
        if (Resources.Queue.length > 0) {
            Resources.loadNextItem();
        }
    }

    static loadTexture(...args) {
        for (let i = 0; i < args.length; i += 2) {
            Resources.Queue.push({ type: 'img', name: args[i], src: args[i + 1] })
        }

        return this;
    }

    static loadNextItem() {
        if (Resources.Queue.length === 0) {
            if (Resources.onComplete)  {
                Resources.onComplete();
            } else {
                console.log('Resource Download Queue Complete');
            }
            return;
        }

        const item = Resources.Queue.pop();
        switch (item.type) {
            case 'img':
                const image = new Image();
                image.queueData = item;
                image.onload = Resources.onDownloadSuccess;
                image.onabort = image.onerror = Resources.onDownloadError;
                image.src = item.src;
                break;
        }
    }

    static onDownloadSuccess() {
        if (this instanceof Image) {
            const data = this.queueData;
            Resources.gl.fLoadTexture(data.name, this);
        }
        Resources.loadNextItem();
    }

    static onDownloadError() {
        console.warn('Error load resource ', this);
        Resources.loadNextItem();
    }
}

Resources.Queue = [];
Resources.onComplete = null;
Resources.gl = null;
