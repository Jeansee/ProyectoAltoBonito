import React from "react";

export default function AboutSection() {
  return (
    <section id="nosotros" className="bg-[#efefef] py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        {/* Grid principal: imágenes izq, texto der */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Columna de imágenes (md: 7/12) */}
          <div className="md:col-span-7">
            <div className="grid grid-cols-12 gap-4">
              {/* grande arriba */}
              <div className="col-span-12">
                <div className="aspect-[16/7] overflow-hidden rounded-xl shadow-md bg-gray-200">
                  <img
                    src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop"
                    alt="Panorámica del lugar"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* dos pequeñas abajo */}
              <div className="col-span-12 sm:col-span-6">
                <div className="aspect-square overflow-hidden rounded-xl shadow-md bg-gray-200">
                  <img
                    src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop"
                    alt="Área social del quincho"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <div className="aspect-square overflow-hidden rounded-xl shadow-md bg-gray-200">
                  <img
                    src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=900&auto=format&fit=crop"
                    alt="Cocina y equipamiento"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna de texto (md: 5/12) */}
          <div className="md:col-span-5">
            <p className="text-xs text-gray-500 mb-2">Some text:</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              A Big Title
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Somos un espacio preparado para celebrar momentos especiales:
              reuniones, cumpleaños y eventos privados. Contamos con áreas
              verdes, quincho equipado, espacios interiores y exteriores, y un
              entorno natural que invita a disfrutar.
            </p>

            <ul className="mt-5 space-y-2 text-gray-700">
              <li>• Capacidad para 100 personas</li>
              <li>• Parrilla y cocina completamente equipada</li>
              <li>• Vistas panorámicas y áreas al aire libre</li>
            </ul>

            <a
              href="#contacto"
              className="inline-flex items-center mt-6 rounded-full bg-indigo-600 px-5 py-2 text-white font-semibold shadow hover:bg-indigo-700 transition"
            >
              Conócenos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
