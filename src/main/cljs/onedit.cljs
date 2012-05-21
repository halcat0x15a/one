(ns onedit
  (:require [onedit.core :as core]
            [onedit.vi :as vi]
            [onedit.file :as file]
            [goog.debug.Console :as console]
            [goog.dom :as dom]
            [goog.editor.Field :as field]
            [goog.events.FileDropHandler :as file-drop-handler]
            [goog.editor.SeamlessField :as seamless-field]
            [goog.events.KeyHandler :as key-handler]
            [goog.events :as events]
            [goog.testing.events :as testing-events]))

(defn create-keymap [field]
  {true
   {79 #(.click (dom/getElement "file"))
    83 #(file/save field)}
   false
   {}})

(defn file-drop [field e]
  (let [browser (.getBrowserEvent e)]
    (file/open field browser.dataTransfer)))

(defn delayed-change [field e]
  (.setItem core/local js/document.title (.getCleanContents field)))

(defn key-handler [field keymap e]
  (.log js/console e)
  (when-let [f ((keymap e.ctrlKey) e.keyCode)]
    (.preventDefault e)
    (f)))

(defn init-buffer [field]
  (let [el (.getElement field)
        keymap (create-keymap field)]
    (events/listen field goog.editor.Field.EventType.DELAYEDCHANGE (partial delayed-change field))
    (events/listen (dom/getElement "file") goog.events.EventType.CHANGE (fn [e] (file/open field e.target)))
    (events/listen (goog.events.KeyHandler. el) goog.events.KeyHandler.EventType.KEY (partial key-handler field keymap))
    (events/listen (goog.events.FileDropHandler. el) goog.events.FileDropHandler.EventType.DROP (partial file-drop field))))

(defn init []
  (console/autoInstall)
  (doto (goog.editor.SeamlessField. "field")
    (.setHtml true (if-let [t (.getItem core/local js/document.title)] t ""))
    (.makeEditable)
    (init-buffer)))
