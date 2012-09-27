(ns one.core.editor
  (:require [clojure.string :as string]
            [one.core :as core]))

(defn buffer [this id]
  (let [buffers (:buffers this)]
    (assoc (if (contains? buffers id)
             this
             (assoc this
               :buffers (assoc buffers
                          id core/unit-buffer)))
      :current id)))

(defn create-buffer [this id]
  (assoc this
    :buffers (assoc (:buffers this)
               id core/unit-buffer)
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
            (core/set-strings this (vec (map name (keys (:buffers this))))))]
    (-> this
        (buffer :buffers)
        set-buffers)))
