(ns onedit.editor
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [goog.array :as garray]
            [onedit.core :as core])
  (:use-macros [onedit.core :only [defun]]))

(defn cursor
  ([] (core/->Cursor (cursor "left") (cursor "top")))
  ([attr] (let [str (aget (aget (dom/ensure-element :cursor) "style") attr)]
            (int (subs str 0 (- (count str) 2))))))

(defn strings []
  (-> (dom/ensure-element :buffer)
      gdom/getRawTextContent
      string/split-lines))

(def buffer (comp (partial apply core/->Buffer) (juxt strings cursor)))

(defn create []
  (core/->Editor {:scratch (buffer)} :scratch))

(defn update [editor]
  (let [{:keys [x y]} (core/get-cursor editor)
        style (str "left: " x "ex; top: " y "em;")]
    (dom/set-properties (dom/ensure-element :cursor) {"style" style})
    (dom/set-text (dom/ensure-element :buffer) (string/join (interpose \newline (core/get-strings editor))))))

(comment
(defn hidden! [buffers]
  (garray/forEach (gdom/getChildren buffers) #(dom/set-properties % {"class" "hidden"})))

(defun new-buffer [editor id]
  (doto (buffers)
    (hidden!)
    (dom/append (dom/ensure-element (str "<div id='" id "' class='current'><span class='cursor'></span><pre class='buffer'></pred></div>"))))
  (create))

(defun chage-buffer [editor id]
  (let [buffers (buffers)]
    (hidden! buffers)
    (dom/set-properties (current-element buffers) {"class" "current"}))
  (create))

(defun commands [editor])
)