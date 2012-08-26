(ns onedit
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.events.EventType :as gevents-type]
            [goog.editor.focus :as gfocus]
            [goog.dom.Range :as grange]
            [onedit.core :as core]
            [onedit.editor :as editor]
            [onedit.buffer :as buffer]
            [onedit.cursor :as cursor]
            [onedit.file :as file]))

(extend-type js/HTMLCollection
  ISeqable
  (-seq [coll] (array-seq coll)))

(def functions
  (merge editor/functions
         buffer/functions
         cursor/functions
         file/functions))

(defn click-buffer [event]
  (let [range (grange/createFromWindow)]
    (reset! core/current-editor (core/set-cursor @core/current-editor (core/->Cursor (.getStartOffset range) 0)))))

(defn main []
  (editor/update @core/current-editor)
  (doto (dom/ensure-element :buffer)
    (event/listen gevents-type/CLICK click-buffer))
  (doto (dom/ensure-element :minibuffer)
    (event/listen gevents-type/CHANGE editor/exec)
    (gfocus/focusInputField)))

(main)
