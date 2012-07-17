(ns onedit
  (:require [cljs.core.logic :as logic]
            [onedit.core :as core]
            [onedit.buffer :as buffer]
            [onedit.minibuffer :as minibuffer]
            [onedit.cursor :as cursor]
            [onedit.insertion :as insertion]
            [onedit.deletion :as deletion]
            [onedit.replacement :as replacement]
            [goog.dom :as dom]
            [goog.dom.Range :as dom-range]
            [goog.events.KeyCodes :as keycodes]
            [goog.debug.Console :as console])
  (:require-macros [cljs.core.logic.macros :as logic-macros]))

(def keymap
  {false {keycodes/H cursor/move-left
          keycodes/J cursor/move-bottom
          keycodes/K cursor/move-top
          keycodes/L cursor/move-right
          keycodes/LEFT cursor/move-left
          keycodes/DOWN cursor/move-bottom
          keycodes/UP cursor/move-top
          keycodes/RIGHT cursor/move-right
          keycodes/W cursor/move-forward
          keycodes/B cursor/move-backward
          keycodes/X deletion/delete-character
          keycodes/ZERO cursor/move-start
          keycodes/SEMICOLON minibuffer/focus
          keycodes/I (fn [_] (insertion/Mode.))
          keycodes/R (fn [_] (replacement/Mode.))
          keycodes/D (fn [_] (deletion/Mode.))}
   true {keycodes/FOUR cursor/move-end}})

(defn x []
  (logic-macros/run* [q] (logic/appendo [1 2] [3 4] q)))

(deftype Mode []
  core/Mode
  (action [this editor e]
    (.preventDefault e)
    (if-let [f ((keymap e.shiftKey) e.keyCode)]
      (f editor)
      this)))

(deftype Editor [mode buffer minibuffer]
  core/IEditor
  (mode [this] this.mode)
  (buffer [this] this.buffer)
  (minibuffer [this] this.minibuffer)
  (normal [this] (Mode.)))

(defn init []
  (console/autoInstall)
  (doto (Editor. (Mode.) (dom/getElement "buffer") (minibuffer/create))
    (buffer/init)))

;    (minibuffer/init)