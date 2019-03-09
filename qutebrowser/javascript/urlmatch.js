/**
 * Copyright 2019 Jay Kamat <jaygkamat@gmail.com>
 *
 * This file is part of qutebrowser.
 *
 * qutebrowser is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * qutebrowser is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with qutebrowser.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * A simple implementation of url match patterns and related tooling. Mirrors
 * urlmatch.py
 */

"use strict";

window._qutebrowser.webelem = (function() {
    const funcs = {};

    const DEFAULT_PORTS = {"https": 443, "http": 80, "ftp": 21};
    const SCHEMES_WITHOUT_HOST = ["about", "file", "data", "javascript"];


    class UrlPattern {
        constructor(pat) {
            // Initialize a UrlPattern
            this._pattern = pat;
            this._match_all = false;
            this._match_subdomains = false;
            this._scheme = null;
            this._host = null;
            this._path = null;
            this._port = null;

            if (this._pattern === "<all_urls>") {
                this._match_all = true;
                return;
            }

            if (this._pattern.includes('\0')) {
                throw new Error("May not contain NUL byte");
            }

            let pattern = UrlPattern.fixupPattern(this._pattern);
            let parsed = null;

            // May throw an exception, which is desired
            parsed = new URL(pattern);
        }

        // Normalize a pattern to match the urlparse.py pattern exactly
        static fixupPattern(pat) {
            let pattern = pat;
            if (pattern.startsWith("*:")) {
                pattern = `any:${pattern.slice(2)}`;
            }

            if (!pattern.contains("://")) {
                for (let i = 0; i < SCHEMES_WITHOUT_HOST.length; i++) {
                    const scheme = SCHEMES_WITHOUT_HOST[i];
                    if (pattern.startsWith(scheme)) {
                        pattern = `any://${pattern}`;
                        break;
                    }
                }
            }

            // Chromium handles file://foo like file:///foo
            if (pattern.startsWith("file://") && !pattern.startsWith(":///")) {
                pattern = `file:///${pattern.slice("file://".length())}`;
            }

            return pattern;
        }

        initScheme(parsed) {
            if (parsed.protocol === "") {
                throw new Error("Missing scheme!");
            }
            // Trim trailing : from protocol
            const scheme = parsed.protocol.slice(0, -1);

            if (scheme === "any") {
                this._scheme = null;
                return;
            }
            this._scheme = scheme;
        }

        initHost(parsed) {
            if (parsed.hostname !== "" || !parsed.hostname.trim()) {
                if (!SCHEMES_WITHOUT_HOST.includes(this._scheme)) {
                    throw new Error("Pattern without host");
                }
                return;
            }
        }
    }

    funcs.UrlPattern = UrlPattern;

    return funcs;
})();
