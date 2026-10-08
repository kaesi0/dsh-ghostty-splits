/**
 * Host half of `dsh-ghostty-splits`, a pure UI plugin.
 *
 * The empty `apply` exists so the package appears on the Host Loader roster
 * (the bundle patch's one row); the browser half ships through
 * `exports["./client"]` and adds the Multi-window Terminal page beside the shipped terminal. PTYs,
 * their controller and the sidebar's docking surface all belong to the shipped
 * plugins this package only arranges, so no host-side code of its own is needed.
 */

/** Host plugin body — no host-side behaviour for this browser surface. */
function apply() {}

export { apply };
