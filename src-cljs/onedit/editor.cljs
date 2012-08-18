(ns onedit.editor
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [goog.array :as garray]
            [onedit.core :as core])
  (:use-macros [onedit.core :only [defun]]))

(defrecord Editor [buffer cursor])

(defun commands [editor])

(defn current? [elem]
  (= (aget elem "className") "current"))

(defn current []
  (let [elems (-> (dom/ensure-element :buffers)
                  gdom/getChildren
                  (garray/find current?)
                  gdom/getChildren)
        cursor (aget elems 0)
        buffer (aget elems 1)]
    (core/->Editor buffer cursor)))

(defn ->cursor
  ([elem] (core/->Cursor (->cursor elem "left") (->cursor elem "top")))
  ([elem attr] (let [str (aget (aget elem "style") attr)]
                 (int (subs str 0 (- (count str) 2))))))

(def ->buffer (comp string/split-lines gdom/getRawTextContent))

(def create (comp (partial apply core/->Editor) (juxt (comp ->buffer :buffer) (comp ->cursor :cursor)) current))

(defn update [editor]
  (let [{:keys [x y]} (:cursor editor)
        style (str "left: " x "ex; top: " y "em;")
        editor' (current)]
    (dom/set-properties (:cursor editor') {"style" style})
    (dom/set-text (:buffer editor') (string/join (interpose \newline (:buffer editor))))))
