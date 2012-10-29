(ns one.core.buffers
  (:require [clojure.zip :as zip]
            [one.core.data :as data]
            [one.core.state :as state])
  (:use;*CLJSBUILD-REMOVE*;-macros
   [one.core.macros :only [defdata do-m]]))

(def default (zip/vector-zip [[]]))

(defn create-buffer [id]
  (let [key (keyword id)]
    (do-m [_ (state/set data/current key)]
          (state/modify data/buffers #(assoc % key default)))))

(defn change-buffer [id]
  (let [key (keyword id)]
    (do-m [buffers (state/get data/buffers)]
          (if (contains? buffers key)
            (state/set data/current key)
            (state/get data/current)))))

(defn get-buffer [id]
  (let [key (keyword id)]
    (do-m [_ (state/set data/current key)]
          (state/modify data/buffers
                        (fn  [buffers]
                          (if (contains? buffers key)
                            buffers
                            (assoc buffers
                              key default)))))))

(defn delete-buffer [id]
  (state/modify data/buffers #(dissoc % (keyword id))))

(defn rename-buffer [id]
  (let [key (keyword id)]
    (do-m [current (state/get data/current)
           _ (state/set data/current key)]
          (state/modify data/buffers
                        (fn [buffers]
                          (assoc (dissoc buffers current)
                            key (current buffers)))))))
