(ns onedit.minibuffer
  (:require [onedit.core :as core]
            [goog.dom :as dom]
            [goog.dom.forms :as forms]
            [goog.events :as events]
            [goog.editor.focus :as focus]
            [goog.ui.Textarea :as textarea]))

(defn focus-out [editor e]
  (.setVisible editor.minibuffer false))

(defn handle-key [editor functionmap e]
  (when (= e.keyCode events/KeyCodes.ENTER)
    (when-let [f (functionmap (keyword (forms/getValue (.getContentElement editor.minibuffer))))]
      (.preventDefault e)
      (f editor))))

(defn create [] (goog.ui.Textarea. ""))

(defn init [editor functionmap]
  (let [element (dom/getElement "minibuffer")]
    (events/listen (events/KeyHandler. element) events/KeyHandler.EventType.KEY (partial handle-key editor functionmap))
    (doto editor.minibuffer
      (events/listen events/EventType.FOCUSOUT (partial focus-out editor))
      (.setVisible false)
      (.decorate element))))

(defn focus [editor]
  (doto editor.minibuffer
    (.setVisible true))
  (focus/focusInputField (.getElement editor.minibuffer)))
