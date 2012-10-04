(ns one.core.buffer
  (:require [one.core.lens :as lens]
            [one.core.cursor :as cursor]
            [one.core.mode :as mode]))

(defrecord Buffer [text cursor mode])

(def default-buffer (Buffer. [""] cursor/default-cursor mode/general-mode))

(def default-minibuffer (Buffer. [""] cursor/default-cursor mode/minibuffer-mode))

(defn get-buffer [this id]
  (let [buffers (:buffers this)
        key (keyword id)]
    (assoc (if (contains? buffers key)
             this
             (assoc this
               :buffers (assoc buffers
                          key default-buffer)))
      :current key)))

(defn create-buffer [id this]
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
            (lens/lens-set lens/text (vec (map name (keys (:buffers this)))) this))]
    (->> this
         (create-buffer :buffers)
         set-buffers)))
