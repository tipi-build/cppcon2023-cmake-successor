import { throttle } from 'lodash'
import { Terminal } from 'xterm'



const Plugin = () => {

    function readUtf8(arrayBuffer, start, length) {
        return decodeURIComponent(escape(String.fromCharCode.apply(
            null, new Uint8Array(arrayBuffer, start, length)
        )))
    }

    function decode(arrayBuffer) {
        const frames = []
        let offset = 0
        const size = arrayBuffer.byteLength
        const data = new DataView(arrayBuffer)

        while (offset < size) {
            let sec = data.getUint32(offset, true)
            offset += 4
            let usec = data.getUint32(offset, true)
            offset += 4
            let length = data.getUint32(offset, true)
            offset += 4

            frames.push({
                time: sec * 1000 + usec / 1000,
                content: readUtf8(arrayBuffer, offset, length)
            })

            offset += length
        }

        return frames
    }

    class Timer {
        constructor(callback, time, rate = 1) {
            this._rate = rate
            this._setTimeout(callback, time)
        }

        set rate(x) {
            this._rate = x

            if (this._rest == null) {
                this.pause()
                this.resume()
            }
        }

        get rest() {
            if (this.finish) {
                return 0
            } else if (this._rest) {
                return this._rest
            } else {
                const rest = this._time - (new Date() - this._startTime)
                return rest > 0 ? rest : 0
            }
        }

        get finish() {
            return this._finish
        }

        _setTimeout(callback, time) {
            this._timer = setTimeout(() => {
                callback()
                this._finish = true
                this._rest = null
            }, time / this._rate)

            this._finish = false
            this._time = time
            this._startTime = new Date()
            this._callback = callback
            this._rest = null
        }

        pause() {
            clearTimeout(this._timer)
            this._rest = this.rest
        }

        resume() {
            if (this._rest != null) {
                this._setTimeout(this._callback, this._rest)
            }
        }

        clear() {
            this.pause()
            this._rest = null
        }
    }

    var EventEmitter = function () {
        this.events = {};
    };

    EventEmitter.prototype.on = function (event, listener) {
        if (typeof this.events[event] !== 'object') {
            this.events[event] = [];
        }

        this.events[event].push(listener);
    };


    EventEmitter.prototype.removeAllListeners = function (type) {
        if (!this._events) return this;

        // fast path
        if (!this._events.removeListener) {
            if (arguments.length === 0) {
                this._events = {};
            } else if (type && this._events && this._events[type]) {
                this._events[type] = null;
            }
            return this;
        }

        // slow(ish) path, emit 'removeListener' events for all removals
        if (arguments.length === 0) {
            for (var key in this._events) {
                if (key === 'removeListener') continue;
                this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = {};
            return this;
        }

        var listeners = this._events[type];
        if (isArray(listeners)) {
            while (listeners.length) {
                // LIFO order
                this.removeListener(type, listeners[listeners.length - 1]);
            }
        } else if (listeners) {
            this.removeListener(type, listeners);
        }
        this._events[type] = null;

        return this;
    };

    EventEmitter.prototype.removeListener = function (event, listener) {
        var idx;

        if (typeof this.events[event] === 'object') {
            idx = indexOf(this.events[event], listener);

            if (idx > -1) {
                this.events[event].splice(idx, 1);
            }
        }
    };

    EventEmitter.prototype.emit = function (event) {
        var i, listeners, length, args = [].slice.call(arguments, 1);

        if (typeof this.events[event] === 'object') {
            listeners = this.events[event].slice();
            length = listeners.length;

            for (i = 0; i < length; i++) {
                listeners[i].apply(this, args);
            }
        }
    };

    EventEmitter.prototype.once = function (event, listener) {
        this.on(event, function g() {
            this.removeListener(event, g);
            listener.apply(this, arguments);
        });
    };

    class TTYCorePlayer extends EventEmitter {
        constructor(options) {
            super()

            const term = new Terminal(options)
            this.term = term

            if (options.parent) {
                term.open(options.parent)

            }
            else {
                this.dispose();
            }

        }

        atEnd() {
            return this.step === this.frames.length
        }

        play(frames) {
            if (frames) {
                this.frames = frames
            }
            this.term.reset()
            this.step = 0
            this.renderFrame()
            this.emit('play')
        }

        pause() {
            this._nextTimer.pause()
            this.emit('pause');
        }

        resume() {
            this._nextTimer.resume()
            this.emit('play');
        }

        renderFrame() {
            const step = this.step
            const frames = this.frames
            const currentFrame = frames[step]
            const nextFrame = frames[step + 1]
            const str = currentFrame.content
            // It seems to be unnecessary and may cause an unexpected behavior.
            // So I ignore it.
            if (str !== '\u001b[?1h\u001b=') {
                this.term.write(str)
            }
            this.step = step + 1

            this.next(currentFrame, nextFrame)
        }

        next(currentFrame, nextFrame) {
            if (nextFrame) {
                this._nextTimer = new Timer(
                    _ => this.renderFrame(),
                    (nextFrame.time - currentFrame.time),
                    this.speed
                )
            } else if (this.repeat) {
                this._nextTimer = new Timer(
                    _ => this.play(),
                    this.interval,
                    this.speed
                )
            } else {
                this.emit('end');
            }
        }

        dispose() {
            this.term.dispose()
            this.removeAllListeners()
            this._nextTimer && this._nextTimer.clear()
        }

    }

    function handleResizeUtil(app) {

    }

    const handleWindowResize = throttle(function (app) {
        handleResizeUtil(app);
    }, 250);

    return {
		id: 'ttyplayer',

		/**
		 * Starts processing and converting Markdown within the
		 * current reveal.js deck.
		 */
		init: async function( reveal ) {

			var deck = reveal;

			let options = deck.getConfig().ttyplayer || {};

            // find the first available font (same list as prismjs)
            const fonts = ["Ubuntu Mono", "Consolas", "Droid Sans Mono", "FreeMono", "Courier New", "Courier", "monospace"];
            
            await document.fonts.ready;
            var firstAvailable = fonts.find(v => document.fonts.check(`12px "${v}"`));
            let allTtyPlayers = Array.from(reveal.getRevealElement().querySelectorAll( 'ttyplayer' ));            

            // init ttyplayers everywhere
            for(var el of allTtyPlayers) {

                if(el.attributes && el.attributes["x-tty-recording"]) {
                   
                    try {
                        const response = await fetch(el.attributes["x-tty-recording"].value);
                        const blob = await response.arrayBuffer();

                        el.ttyplayer = new TTYCorePlayer({
                            parent: el,
                            fontFamily: firstAvailable,
                            ...options
                        });
                    
                        el.ttyplayer_frames = decode(blob)
                    } catch (err) {
                        console && console.error(err)
                    }
                }

            }
           

            deck.addEventListener( 'slidechanged', event => {
                let currentSlideTtyEl = event.currentSlide?.querySelector('ttyplayer');
                if(currentSlideTtyEl && currentSlideTtyEl.ttyplayer) {
                    currentSlideTtyEl.ttyplayer.play(currentSlideTtyEl.ttyplayer_frames);
                }

                let previousSlideTtyEl = event.previousSlide?.querySelector('ttyplayer');
                if(previousSlideTtyEl && previousSlideTtyEl.ttyplayer) {
                    previousSlideTtyEl.ttyplayer.pause();
                }
            });

		}
	}
}

export default () => Plugin();