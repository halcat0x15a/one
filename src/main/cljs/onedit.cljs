(ns onedit
  (:require [onedit.core :as core]
            [goog.object :as object]
            [goog.array :as array]
            [goog.string :as string]
            [goog.dom :as dom]
            [goog.dom.forms :as forms]
            [goog.events :as events]
            [goog.style :as style]
            [goog.debug.Console :as console]
            [goog.uri.utils :as uri-utils]
            [goog.net.cookies :as cookies]
            [goog.net.XhrIo :as xhr-io]
            [goog.editor.SeamlessField :as field]
            [goog.editor.plugins.BasicTextFormatter :as text-formatter]
            [goog.ui.FormPost :as form-post]
            [goog.events.FileDropHandler :as file-drop]))

(defn highlight-success [e]
  (let [text (string/newLineToBr (.getResponseText e.target) true)]
    (core/log text)
    (.html (core/buffer-array) text)))

(def highlight-xhr
  (doto (goog.net.XhrIo.)
    (events/listen goog.net.EventType.SUCCESS highlight-success)
    (events/listen goog.net.EventType.ERROR (fn [e] (core/log (.getLastError e.target))))))

(defn highlight [content]
  (let [lang (.get goog.net.cookies "lang" "plain")]
    (core/log content)
    (core/log lang)
    (.abort highlight-xhr)
    (.send highlight-xhr "highlight" "POST" (uri-utils/buildQueryDataFromMap (object/create "lang" lang "content" content)))))

(def highlight-buffer (comp highlight core/buffer-content))

(defn load-files [target]
  (let [reader (js/FileReader.)]
    (set! reader.onload (fn [e] (highlight e.target.result)))
    (.readAsText reader (aget target.files 0))))

(defn buffer-blur [e]
  (highlight-buffer))

(defn buffer-delayed-change [e]
  (.abort highlight-xhr))

(defn save []
  (let [text (core/buffer-content)]
    (when-not (string/isEmpty text)
      (.post (goog.ui.FormPost.) (object/create "content" text) (str "save/" (.get goog.net.cookies "filename"))))))

(defn send-lexers [callback]
  (xhr-io/send "lexers" (fn [e] (callback (.getResponseJson e.target)))))

(defn set-lexers [lexers]
  (core/log lexers)
  (.typeahead (core/jquery "#lang") (object/create "source" (array/map lexers (fn [lang] lang.name)))))

(defn set-lang [lang]
  (fn [lexers]
    (if-let [aliases (array/find lexers #(object/contains % lang))]
      (let [alias (aget aliases "alias")]
        (core/log lang)
        (core/log alias)
        (.set goog.net.cookies "lang" alias)
        (highlight-buffer)))))

(defn chage-lang [e]
  (let [lang (forms/getValue e.target)]
    (send-lexers (set-lang lang))))

(defn file-drop [e]
  (let [browser (.getBrowserEvent e)]
    (load-files browser.dataTransfer.files)))

(defn listen-events []
  (let [file (core/jquery "#file")]
    (doto (core/buffer-array)
      (.blur buffer-blur)
      (.bind "DOMCharacterDataModified" buffer-delayed-change))
    (events/listen (goog.events.FileDropHandler. (core/buffer)) goog.events.FileDropHandler.EventType.DROP file-drop)
    (.click (core/jquery "#open") #(.click file))
    (.change file (fn [e] (load-files e.target)))
    (.click (core/jquery "#save") save)
    (.change (core/jquery "#lang") chage-lang)))

(def show-tab #(.tab % "show"))

(defn add-tab [id elem]
  (.append (core/jquery ".nav-tabs") (dom/createDom "li" nil (dom/createDom "a" (object/create "href" (str "#" id)) id)))
  (.append (core/jquery ".tab-content") (dom/createDom "div" (object/create "id" id "class" "tab-pane") elem))
  (.click (core/jquery ".nav-tabs li a") #(this-as me
                                                   (.preventDefault %)
                                                   (show-tab (core/jquery me))))
  (show-tab (core/jquery ".nav-tabs li a:last")))

(defn add-buffer [id]
  (add-tab id (dom/createElement "pre"))
  (.attr (core/jquery (str "#" id " pre")) "contenteditable" "true"))

(defn init []
  (console/autoInstall)
  (send-lexers set-lexers)
  (when-not (.get goog.net.cookies "filename")
    (.set goog.net.cookies "filename" "scratch"))
  (add-buffer "scratch")
  (listen-events))
