(ns onedit.file
  (:require [onedit.core :as core]
            [goog.string :as string]
            [goog.dom :as dom]
            [goog.events :as events]
            [goog.ui.FormPost :as form-post]))

(def file-form
  (let [submit (dom/createDom "input" (js-obj "type" "submit"))
        file (doto (dom/createDom "input" (js-obj "type" "file" "name" "file"))
               (events/listen events/EventType.CHANGE #(.click submit)))]
    (dom/createDom "form" (js-obj "method" "POST" "action" "/open" "enctype" "multipart/form-data")
                   file
                   submit)
    file))

(defn open [editor]
  (.click file-form))

(def form-post (goog.ui.FormPost.))

(defn save [editor]
  (let [text (dom/getRawTextContent editor.buffer)]
    (when-not (empty? text)
      (.post form-post (js-obj "content" text) (str "/save/" js/document.title)))))
