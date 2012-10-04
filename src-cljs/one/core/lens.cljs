(ns one.core.lens)

(defprotocol Lens
  (lens-get [this editor])
  (lens-set [this value editor]))

(defn modify [lens f editor]
  (lens-set lens (f (lens-get lens editor)) editor))

(defn editor-lens [key]
  (reify Lens
    (lens-get [this editor] (get editor key))
    (lens-set [this value editor]
      (assoc editor key value))))

(defn lens-lens [key lens]
  (reify Lens
    (lens-get [this editor]
      (get (lens-get lens editor) key))
    (lens-set [this value editor]
      (modify lens #(assoc % key value) editor))))

(def buffers (editor-lens :buffers))

(def minibuffer (editor-lens :minibuffer))

(def minibuffer-text (lens-lens :text minibuffer))

(def history (editor-lens :history))

(def commands (lens-lens :commands history))

(def current-command (lens-lens :current history))

(def history-cursor (lens-lens :cursor history))

(def buffer
  (reify Lens
    (lens-get [this editor]
      (let [current (:current editor)]
        (case current
          :minibuffer (current editor)
          (current (:buffers editor)))))
    (lens-set [this buffer editor]
      (let [current (:current editor)]
        (case current
          :minibuffer (assoc editor :minibuffer buffer)
          (assoc editor
            :buffers (assoc (:buffers editor)
                       current buffer)))))))

(def cursor (lens-lens :cursor buffer))

(def cursor-x (lens-lens :x cursor))

(def cursor-y (lens-lens :y cursor))

(def text (lens-lens :text buffer))

(def count-lines (comp count (partial lens-get text)))

(defn line [y]
  (lens-lens y text))

(defn count-line [y editor]
  (when-let [line (lens-get (line y) editor)]
    (count line)))
