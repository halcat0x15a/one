(ns onedit.editor
  (:require [clojure.string :as string]
            [onedit.core :as core]))

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

(defn buffers [this]
  (letfn [(set-buffers [this]
            (core/set-strings this (map name (keys (:buffers this)))))]
    (-> this
        (buffer :buffers)
        set-buffers)))
