(ns onedit.editor
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [goog.array :as garray]
            [onedit.core :as core])
  (:use-macros [onedit.core :only [defun]]))

(defn buffers []
  (dom/ensure-element :buffers))

(defn current? [elem]
  (= (aget elem "className") "current"))

(defn current-element [buffers]
  (-> buffers
      gdom/getChildren
      (garray/find current?)
      gdom/getChildren))

(defn current []
  (let [elems (current-element (buffers))
        cursor (aget elems 0)
        buffer (aget elems 1)]
    (core/->Editor buffer cursor)))

(defn cursor
  ([elem] (core/->Cursor (cursor elem "left") (cursor elem "top")))
  ([elem attr] (let [str (aget (aget elem "style") attr)]
                 (int (subs str 0 (- (count str) 2))))))

(def buffer (comp string/split-lines gdom/getRawTextContent))

(def create (comp (partial apply core/->Editor) (juxt (comp buffer :buffer) (comp cursor :cursor)) current))

(defn update [editor]
  (let [{:keys [x y]} (:cursor editor)
        style (str "left: " x "ex; top: " y "em;")
        editor' (current)]
    (dom/set-properties (:cursor editor') {"style" style})
    (dom/set-text (:buffer editor') (string/join (interpose \newline (:buffer editor))))))

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
