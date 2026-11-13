const svg=body=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" shape-rendering="crispEdges">'+body+'</svg>';
export const GAME_ICONS={
  balloon:svg('<path fill="#263248" d="M7 1h6v1h3v2h2v5h-1v2h-2v2h-2v2h1v4H6v-4h1v-2H5v-2H3V9H2V4h2V2h3z"/><path fill="#e5a282" d="M7 3h6v1h3v5h-1v2h-2v1H7v-1H5V9H4V4h3z"/><path fill="#fff0c6" d="M8 3h4v8h-1v1H9v-1H8z"/><path fill="#b98960" d="M7 16h6v2H7z"/><path fill="#f3d391" d="M8 13h1v2H8zM11 13h1v2h-1z"/>'),
  brain:svg('<path fill="#263248" d="M7 2h6v1h3v2h2v9h-2v3h-4v1H7v-1H4v-3H2V7h2V4h3z"/><path fill="#e5a2a1" d="M7 4h5v1h3v2h1v6h-2v2h-3V6H9v10H7v-1H5v-3H4V8h2V6h1z"/><path fill="#fff8e4" d="M7 5h2v2H7zM5 9h2v2H5zM12 7h2v2h-2z"/><path fill="#94bbb5" d="M14 14h4v2h-2v2h-3v-2h-2v-2z"/>'),
  rice:svg('<path fill="#263248" d="M4 4h3V2h5v2h3v3h2v4h-1v4h-2v2H6v-2H4v-4H3V7h1z"/><path fill="#fff8e4" d="M5 6h3V4h3v2h3v2H5z"/><path fill="#94bbb5" d="M5 10h10v3h-2v2H7v-2H5z"/><path fill="#f3d391" d="M6 8h3v1H6zM11 6h2v1h-2z"/><path fill="#8fb9c2" d="M16 2h3v3h-3z"/><path fill="#fff8e4" d="M16 2h1v1h-1z"/>'),
  regulars:svg('<path fill="#263248" d="M2 9h16v4h-2v5h-3v-5H7v5H4v-5H2zM5 4h8v1h2v3H3V5h2z"/><path fill="#b98960" d="M3 10h14v2H3zM5 13h1v4H5zM14 13h1v4h-1z"/><path fill="#fff8e4" d="M5 5h8v2H5z"/><path fill="#f3d391" d="M7 3h4v3H7z"/><path fill="#94bbb5" d="M16 2h2v2h-2zM14 4h2v2h-2zM17 5h2v2h-2z"/>'),
  planks:svg('<path fill="#263248" d="M9 1h2v7h6v3h2v3h-2v3H4v-2H2v-4h3V8h4z"/><path fill="#fff8e4" d="M11 3h3v2h2v2h-5z"/><path fill="#b98960" d="M5 10h10v2h2v2h-2v1H5v-2H4v-1h1z"/><path fill="#65482e" d="M6 11h3v1H6zM11 13h3v1h-3z"/><path fill="#8fb9c2" d="M3 17h3v1h7v-1h4v2H3z"/><path fill="#f3d391" d="M7 13h2v2H7z"/>')
};
export const gameIconUrl=id=>'data:image/svg+xml,'+encodeURIComponent(GAME_ICONS[id]);
