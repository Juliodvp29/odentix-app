# features

One folder per business feature (patients, appointments, ...). Each
feature owns its routes (always lazy-loaded), components, and services.
Features never import from each other — code needed in more than one
feature goes in `shared/`, app-wide services go in `core/`.
