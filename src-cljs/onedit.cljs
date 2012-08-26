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
            [onedit.file :as file])
  (:use-macros [onedit.core :only [fn-map]]))

(extend-type js/HTMLCollection
  ISeqable
  (-seq [coll] (array-seq coll)))

(extend-type js/FileList
  ISeqable
  (-seq [files]
    (array-seq files)))

(def functions
  (merge (fn-map cursor/left
                 cursor/down
                 cursor/up
                 cursor/right
                 cursor/forward
                 cursor/backward
                 cursor/start-line
                 cursor/end-line
                 cursor/start-buffer
                 cursor/end-buffer
                 buffer/insert
                 buffer/append-newline
                 buffer/prepend-newline
                 buffer/delete-forward
                 buffer/delete-backward
                 buffer/delete-line
                 buffer/replace-character
                 editor/delete-buffer
                 editor/buffer
                 editor/buffers
                 editor/grep
                 editor/commands
                 editor/count-lines
                 editor/sum
                 editor/apply-buffers
                 file/open)
         {:h cursor/left
          :j cursor/down
          :k cursor/up
          :l cursor/right
          :w cursor/forward
          :b cursor/backward
          :| cursor/start-line
          :$ cursor/end-line
          :gg cursor/start-buffer
          :G cursor/end-buffer
          :i buffer/insert
          :o buffer/append-newline
          :O buffer/prepend-newline
          :x buffer/delete-forward
          :X buffer/delete-backward
          :dd buffer/delete-line
          :r buffer/replace-character}))

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
