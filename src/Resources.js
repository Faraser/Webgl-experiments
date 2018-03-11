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
            const options = typeof args[i + 1] === 'string' ? { src: args[i + 1] } : args[i + 1];
            Resources.Queue.push({ type: 'img', name: args[i], src: options.src, doYFlip: options.doYFlip });
        }

        return this;
    }

    static loadObjFile(...args) {
        for (let i = 0; i < args.length; i += 2) {
            Resources.Queue.push({ type: 'obj', name: args[i], src: args[i + 1] });
        }

        return this;

    }

    static loadVideoTexture(...args) {
        for (let i = 0; i < args.length; i += 2) {
            Resources.Queue.push({ type: 'vid', name: args[i], src: args[i + 1] });
        }
        return this;
    }

    static loadNextItem() {
        if (Resources.Queue.length === 0) {
            if (Resources.onComplete) {
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
                Resources.Images[item.name] = image;
                break;
            case 'obj':
                fetch(item.src)
                    .then(res => res.text())
                    .then(text => {
                        item.data = text;
                        Resources.onDownloadSuccess.call(item);
                    })
                    .catch(Resources.onDownloadError);
                break;
            case 'vid':
                const video = document.createElement('video');
                video.style.display = 'none';
                document.body.appendChild(video);
                video.queueData = item;
                video.addEventListener('loadeddata', Resources.onDownloadSuccess, false);
                video.onabort = video.onerror = Resources.onDownloadError;
                video.autoplay = true;
                video.loop = true;
                video.src = item.src;
                video.load();
                video.play();
                Resources.Videos[item.name] = video;
                break;
        }
    }

    static onDownloadSuccess() {
        if (this instanceof Image || this.tagName === 'VIDEO') {
            const data = this.queueData;
            Resources.gl.fLoadTexture(data.name, this, data.doYFlip);
        }

        if (this.type === 'obj') {
            ObjLoader.srcToMesh(this.name, this.data);
        }
        Resources.loadNextItem();
    }

    static onDownloadError() {
        console.warn('Error load resource ', this);
        Resources.loadNextItem();
    }
}

Resources.Queue = [];
Resources.Videos = {};
Resources.Images = {};
Resources.onComplete = null;
Resources.gl = null;
