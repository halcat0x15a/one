(ns one.live
  (:require [clojure.browser.dom :as dom]
            [clojure.browser.net :as net]
            [one.core :as core]
            [one.editor :as editor]))

(def pusher (delay (js/Pusher. "001b60ce1d2033e954ab")))

(defn live [event]
  (dom/log event)
  (doto (net/xhr-connection)
    (net/transmit "/live" "POST" (js-obj "content" (core/get-string @core/current-editor)))))

(defn listen [editor']
  (doto @pusher
    (.subscribe "live")
    (-> .-connection (.bind "listen" (fn [x] (core/set-string @core/current-editor (.-content x))))))
  (-> editor'
      (editor/buffer :listen)))

(defn publish [editor]
  (net/transmit (net/xhr-connection) "/publish" "POST")
  (event/listen (dom/ensure-element :buffer) goog.events.InputHandler.EventType/INPUT live)
  editor)
