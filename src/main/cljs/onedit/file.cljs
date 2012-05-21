(ns onedit.file
  (:require [onedit.core :as core]
            [goog.object :as object]
            [goog.string :as string]
            [goog.dom :as dom]
            [goog.ui.FormPost :as form-post]))

(defn open [field target]
  (let [reader (js/FileReader.)
        file (aget target.files 0)]
    (set! reader.onload (fn [e] (.setHtml field true (string/newLineToBr e.target.result) false)))
    (.readAsText reader file)))

(defn save [field]
  (let [text (.getCleanContents field)]
    (when-not (empty? text)
      (.post (goog.ui.FormPost.) (object/create "content" text) (str "/save/" js/document.title)))))
