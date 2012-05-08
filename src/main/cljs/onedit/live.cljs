(ns onedit.live
  (:require [onedit.core :as core]
            [onedit.tab :as tab]
            [onedit.file :as file]))

(defn live
  ([]
     (let [socket (js/WebSocket. (str "ws://localhost:5000/live/" (.attr (tab/get) "id")))]
       (set! socket.onmessage (fn [e] (core/log e.data)))
       (tab/data "socket" socket)))
  ([id filename]
     (file/create filename)
     (let [socket (js/WebSocket. (str "ws://localhost:5000/live/" id \/ filename))
           i (.attr (tab/get) "id")]
       (core/log i)
       (set! socket.onmessage (fn [e]
                                (core/log e.data)
                                (.html (core/jquery (str "#" i)) e.data))))))
