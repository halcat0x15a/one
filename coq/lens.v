Inductive lens A B := mkLens : (A -> B) -> (B -> A -> A) -> lens A B.

Class Compose (F : Type -> Type -> Type) := {
  compose : forall {A B C}, F B C -> F A B -> F A C;
  associativity : forall A B C D (ab : F A B) (bc : F B C) (cd : F C D),
    compose cd (compose bc ab) = compose (compose cd bc) ab
}.

Instance lens_Compose : Compose lens := {
  compose A B C f g :=
    mkLens A C (fun x  => f.(get B C) (g.(get A B) x)) (fun x y => g.(set A B) (f.(set B C) x (g.(get A B) y)) y)
}.

Proof.
intros.
apply A.