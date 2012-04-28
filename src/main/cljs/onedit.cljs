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
            [goog.Uri :as uri]
            [goog.uri.utils :as uri-utils]
            [goog.net.cookies :as cookies]
            [goog.net.XhrIo :as xhr-io]
            [goog.editor.SeamlessField :as field]
            [goog.editor.plugins.BasicTextFormatter :as text-formatter]
            [goog.ui.FormPost :as form-post]
            [goog.events.FileDropHandler :as file-drop]))

(defn highlight-success [e callback]
  (let [text (string/newLineToBr (.getResponseText e.target) true)]
    (core/log text)
    (callback text)))

(defn highlight-xhr [callback]
  (doto (goog.net.XhrIo.)
    (events/listen goog.net.EventType.SUCCESS #(highlight-success % callback))
    (events/listen goog.net.EventType.ERROR (fn [e] (core/log (.getLastError e.target))))))

(defn highlight
  ([content callback]
     (highlight content callback "language" (.get goog.net.cookies "language" "plain")))
  ([content callback filename]
     (highlight content callback "filename" filename))
  ([content callback key value]
     (when-not (string/isEmpty content)
       (let [url (str "highlight/" key \/ value)]
         (core/log content)
         (core/log url)
         (.send (highlight-xhr callback) url "POST" (uri-utils/buildQueryDataFromMap (object/create "content" content)))))))

(def set-html #(.html (core/buffer-array) %))

(defn highlight-buffer []
  (highlight (core/buffer-content) set-html))

(defn open-file [target]
  (let [reader (js/FileReader.)
        file (aget target.files 0)]
    (.text (core/jquery ".nav-tabs .active a") file.name)
    (set! reader.onload (fn [e] (highlight e.target.result set-html file.name)))
    (.readAsText reader file)))

(defn buffer-blur [e]
  (highlight-buffer))

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
        (.set goog.net.cookies "language" alias)
        (highlight-buffer)))))

(defn chage-lang [e]
  (let [lang (forms/getValue e.target)]
    (send-lexers (set-lang lang))))

(defn file-drop [e]
  (let [browser (.getBrowserEvent e)]
    (open-file browser.dataTransfer)))

(defn listen-events []
  (let [file (core/jquery "#file")]
    (.click (core/jquery "#new-tab") #(add-buffer "scratch"))
    (.click (core/jquery "#open") #(.click file))
    (.change file (fn [e] (open-file e.target)))
    (.click (core/jquery "#save") save)
    (.change (core/jquery "#lang") chage-lang)))

(def show-tab #(.tab % "show"))

(defn add-tab [id elem]
  (let [a (dom/createDom "a" (object/create "href" (str "#" id)) id)]
    (.append (core/jquery ".nav-tabs") (dom/createDom "li" nil a))
    (.append (core/jquery ".tab-content") (dom/createDom "div" (object/create "id" id "class" "tab-pane") elem))
    (events/listen a goog.events.EventType.CLICK (fn [e]
                                                   (core/log e.target)
                                                   (.preventDefault e)
                                                   (show-tab (core/jquery e.target))))
    (show-tab (core/jquery ".nav-tabs li a:last"))))

(defn add-buffer
  ([id] (add-buffer id ""))
  ([id content]
     (let [pre (doto (dom/createDom "pre" nil content)
                 (.setAttribute "contenteditable" "true"))]
       (add-tab id pre)
       (events/listen (goog.events.FileDropHandler. pre) goog.events.FileDropHandler.EventType.DROP file-drop)
       (events/listen pre goog.events.EventType.BLUR buffer-blur))))

(defn init []
  (console/autoInstall)
  (send-lexers set-lexers)
  (when-not (.get goog.net.cookies "filename")
    (.set goog.net.cookies "filename" "scratch"))
  (add-buffer "scratch")
  (listen-events))
