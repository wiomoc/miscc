---
tags: embedded
title: Second Post
---

# Heading Second

Link to [first post](#article_0001)

<link href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/styles/atom-one-light.min.css" rel="stylesheet">

[^1]

lolol

lolol

lolol

lolol

lolol

lolol

lolol

lolol

lolol

lolol

lolol

lolol

lolol

lolol

lolol

lolol

[^1]: https://www6.uniovi.es/gifanim/gif89a.txt

ss

```kotlin
fun main() {
    embeddedServer(Netty, port = 8000) {
        routing {
            get ("/") {
                call.respondText("Hello, world!")
            }
        }
    }.start(wait = true)
}
```
