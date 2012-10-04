(ns one.core.buffer
  (:require [one.core.lens :as lens]
            [one.core.cursor :as cursor]
            [one.core.mode :as mode]))

(defrecord Buffer [text cursor mode])

(def default-buffer (Buffer. [""] cursor/default-cursor mode/general-mode))

(defn get-buffer [id editor]
  (let [key (keyword id)]
    (letfn [(set-buffer [buffers]
              (if (contains? buffers key)
                buffers
                (assoc buffers
                  key default-buffer)))]
      (->> editor
           (lens/modify lens/buffers set-buffer)
           (lens/lens-set lens/current-buffer key)))))

(defn create-buffer [id editor]
  (let [key (keyword id)]
    (->> editor
         (lens/modify lens/buffers #(assoc % key default-buffer))
         (lens/lens-set lens/current-buffer key))))

(defn change-buffer [id editor]
  (let [key (keyword id)]
    (if (contains? (:buffers editor) key)
      (assoc editor :current key)
      editor)))

(defn delete-buffer [id editor]
  (lens/modify lens/buffers #(dissoc % (keyword id)) editor))

(defn rename-buffer [id editor]
  (let [key (keyword id)
        current (:current editor)]
    (->> editor
         (lens/modify lens/buffers #(assoc (dissoc % current)
                                      key (current %)))
         (lens/lens-set lens/current-buffer key))))

(defn buffers [editor]
  (->> editor
       (create-buffer :buffers)
       (lens/lens-set lens/text (vec (map name (keys (:buffers editor)))))))
