(ns one.core.buffer
  (:require [one.core.data :as data]
            [one.core.state :as state])
  (:use;*CLJSBUILD-REMOVE*;-macros
   [one.core.macros :only [defdata for-m]]))

(comment
(defn create-buffer [id editor]
  (let [key (keyword id)]
    (->> editor
         (lens/modify lens/buffers #(assoc % key default/buffer))
         (lens/lens-set lens/current-buffer key))))

(defn change-buffer [id editor]
  (let [key (keyword id)]
    (if (contains? (:buffers editor) key)
      (assoc editor :current key)
      editor)))

(defn get-buffer [id editor]
  (let [key (keyword id)]
    (letfn [(set-buffer [buffers]
              (if (contains? buffers key)
                buffers
                (assoc buffers
                  key default/buffer)))]
      (->> editor
           (lens/modify lens/buffers set-buffer)
           (lens/lens-set lens/current-buffer key)))))

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
)
