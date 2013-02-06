(ns felis.group
  (:require [clojure.string :as string]
            [felis.style :as style]
            [felis.buffer :as buffer]
            [felis.node :as node]
            [felis.minibuffer :as minibuffer]
            [felis.default :as default]))

(defn render [{:keys [buffer minibuffer style]}]
  (node/tag :html {}
            (node/tag :head {}
                      (node/tag :style {:type "text/css"}
                                "<!-- "
                                (style/css style)
                                " -->"))
            (node/tag :body {}
                      (node/tag :div {:class :editor}
                                (node/render buffer)
                                (node/render minibuffer)))))

(defrecord Group [buffer buffers minibuffer style]
  node/Node
  (render [group] (render group)))

(def path [:root])

(def default
  (Group. buffer/default [] minibuffer/default style/default))

(defmethod node/path Group [_] path)

(defmethod default/default Group [_] default)
