(ns onedit.editor
  (:require [clojure.string :as string]
            [onedit.core :as core]))

(defn create-buffer [this id]
  (let [id (keyword id)]
    (assoc this
      :buffers (assoc (:buffers this)
                 id core/unit-buffer)
      :current id)))

(defn change-buffer [this id]
  (let [id (keyword id)]
    (if (contains? (:buffers this) id)
      (assoc this :current id)
      this)))

(defn buffer [this id]
  (let [key (keyword id)
        buffers (:buffers this)]
    (assoc (if (contains? buffers key)
             this
             (assoc this
               :buffers (assoc buffers
                          key core/unit-buffer)))
      :current key)))

(defn delete-buffer [this id]
  (assoc this
    :buffers (dissoc (:buffers this) id)))

(defn rename-buffer [this id]
  (let [buffers (:buffers this)
        current (:current this)
        id (keyword id)]
    (assoc this
      :buffers (assoc (dissoc buffers current)
                 id (current buffers))
      :current id)))

(defn buffers [this]
  (letfn [(set-buffers [this]
            (core/set-strings this (vec (map name (keys (:buffers this))))))]
    (-> this
        (buffer :buffers)
        set-buffers)))
