(ns onedit.file
  (:require [onedit.core :as core]
            [goog.object :as object]
            [goog.string :as string]
            [goog.dom :as dom]
            [goog.events :as events]
            [goog.ui.FormPost :as form-post]))

(def file-form
  (let [submit (dom/createDom "input" (object/create "type" "submit"))
        file (doto (dom/createDom "input" (object/create "type" "file" "name" "file"))
               (events/listen goog.events.EventType.CHANGE #(.click submit)))]
    (dom/createDom "form" (object/create "method" "POST" "action" "/open" "enctype" "multipart/form-data")
                   file
                   submit)
    file))

(defn open []
  (.click file-form))

(def form-post (goog.ui.FormPost.))

(defn save [buffer]
  (let [text (dom/getRawTextContent buffer)]
    (when-not (empty? text)
      (.post form-post (object/create "content" text) (str "/save/" js/document.title)))))
