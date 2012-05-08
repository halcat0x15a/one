(ns onedit.core
  (:require [goog.dom :as dom]
            [goog.net.XhrIo :as xhr-io]
            [goog.debug.Logger :as logger]))

(def logger (logger/getLogger "onedit"))

(def jquery (js* "$"))

(def log #(.info logger %))

(def filenames-map {})

(defn unique-name [name]
  (let [[unique names] (if-let [names (filenames-map name)]
                         [(str name "-" (inc (count names))) names]
                         [name []])]
    (set! filenames-map (assoc filenames-map name (conj names unique)))
    unique))

(defn send [url method content headers timeout-interval]
  #(xhr-io/send url (fn [xhr] (% xhr.target)) method content headers timeout-interval))

(defn bind [f g]
  #(f (fn [x] ((g x) %))))

(defn fmap [f g]
  #(f (fn [x] (% (g x)))))
