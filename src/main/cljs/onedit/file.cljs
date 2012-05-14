(ns onedit.file
  (:require [onedit.core :as core]
            [onedit.buffer :as buffer]
            [onedit.tab :as tab]
            [onedit.highlighter :as highlighter]
            [goog.object :as object]
            [goog.dom :as dom]
            [goog.events :as events]
            [goog.events.FileDropHandler :as file-drop]
            [goog.ui.FormPost :as form-post]))

(defn open [target]
  (let [reader (js/FileReader.)
        file (aget target.files 0)]
    (tab/set-name file.name)
    (set! reader.onload (fn [e]
                          (buffer/set-html e.target.result)
                          (highlighter/filename file.name)))
    (.readAsText reader file)))

(defn save []
  (let [text (buffer/content)]
    (when-not (empty? text)
      (.post (goog.ui.FormPost.) (object/create "content" text) (str "save/" (tab/data "filename"))))))

(defn blur [e]
  (highlighter/highlight))

(defn delayed-change [e])

(defn drop [e]
  (let [browser (.getBrowserEvent e)]
    (open browser.dataTransfer)))

(defn create
  ([name] (create name ""))
  ([name content]
     (let [pre (doto (dom/createDom "pre" (object/create "class" "prettyprint") content)
                 (.setAttribute "contenteditable" "true")
                 (events/listen "DOMCharacterDataModified" delayed-change)
                 (events/listen goog.events.EventType.BLUR blur))]
       (events/listen (goog.events.FileDropHandler. pre) goog.events.FileDropHandler.EventType.DROP drop)
       (tab/add name pre))))

(defn listen []
  (let [file (core/jquery "#file")]
    (.click (core/jquery "#new-tab") #(create "scratch"))
    (.click (core/jquery "#open") #(.click file))
    (.change file (fn [e] (open e.target)))
    (.click (core/jquery "#save") save)))
