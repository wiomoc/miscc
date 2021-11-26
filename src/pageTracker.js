import fs from 'fs';
import path from 'path';

const posts = "posts";
const postsOutputDir = "posts";

export class PageTracker {
    constructor() {
        this.posts = new Map();
    }

    resolve(ref) {
        if (!ref) return;
        let href;
        if (ref.startsWith("#")) {
            const postId = ref.substring(1);
            const post = this.posts.get(postId);
            if (!post) {
                console.warn(`couldn't resolve reference to post '${postId}'`);
                return
            }
            return "/" + post.dest;
        } else {
            return null;
        }
    }

    addPost(postFile) {
        let postId = path.basename(postFile);
        if (postId === "post.md") {
            postId = path.basename(path.dirname(postFile));
        } else {
            // remove .md
            postId = postId.substring(0, postId.length - 3);
        }

        if (this.posts.has(postId)) {
            throw new Error(`Duplicate post '${postId}'`);
        }
        this.posts.set(postId, {
            src: postFile,
            dest: postsOutputDir + "/" + postId + ".html"
        });
    }

    discover(dir = postsOutputDir) {
        for (let filepath of fs.readdirSync(dir)) {
            filepath = dir + "/" + filepath;
            if (fs.statSync(filepath).isDirectory()) {
                this.discover(filepath)
            } else if (path.extname(filepath) === ".md") {
                this.addPost(filepath);
            }
        }
    }
}