(ns one.core.buffer
  (:require [one.core :as core]
            [one.core.cursor :as cursor]
            [one.core.mode :as mode]))

(defrecord Buffer [text cursor mode])

(def default-buffer (Buffer. [""] cursor/default-cursor mode/general-mode))

(def default-minibuffer (Buffer. [""] cursor/default-cursor mode/minibuffer-mode))

(defn get-buffer [this id]
  (let [buffers (:buffers this)]
    (assoc (if (contains? buffers id)
             this
             (assoc this
               :buffers (assoc buffers
                          id default-buffer)))
      :current id)))

(defn create-buffer [this id]
  (assoc this
    :buffers (assoc (:buffers this)
               id default-buffer)
    :current id))

(defn change-buffer [this id]
  (if (contains? (:buffers this) id)
    (assoc this :current id)
    this))

(defn delete-buffer [this id]
  (assoc this
    :buffers (dissoc (:buffers this) id)))

(defn rename-buffer [this id]
  (let [buffers (:buffers this)
        current (:current this)]
    (assoc this
      :buffers (assoc (dissoc buffers current)
                 id (buffers current))
      :current id)))

(defn buffers [this]
  (letfn [(set-buffers [this]
            (core/set-text this (vec (map name (keys (:buffers this))))))]
    (-> this
        (create-buffer :buffers)
        set-buffers)))
